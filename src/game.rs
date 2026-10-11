use rand::{rng, seq::SliceRandom};

const PAIR_COUNT: u8 = 8;

struct Card {
    value: u8,
    face_up: bool,
    matched: bool,
}

pub struct GameState {
    cards: Vec<Card>,
    current_player: u8,
    scores: [u8; 2],
    first_flipped: Option<usize>,
    second_flipped: Option<usize>,
    game_over: bool,
}

impl GameState {
    pub fn new() -> Self {
        let mut values = Vec::with_capacity((PAIR_COUNT * 2) as usize);
        for value in 0..PAIR_COUNT {
            values.push(value);
            values.push(value);
        }
        values.shuffle(&mut rng());
        let cards = values
            .into_iter()
            .map(|value| Card {
                value,
                face_up: false,
                matched: false,
            })
            .collect();

        Self {
            cards,
            current_player: 1,
            scores: [0, 0],
            first_flipped: None,
            second_flipped: None,
            game_over: false,
        }
    }

    pub fn card_count(&self) -> u32 {
        self.cards.len() as u32
    }

    pub fn card_value(&self, index: u32) -> u8 {
        self.cards
            .get(index as usize)
            .map(|card| card.value)
            .unwrap_or(0)
    }

    pub fn is_face_up(&self, index: u32) -> bool {
        self.cards
            .get(index as usize)
            .map(|card| card.face_up)
            .unwrap_or(false)
    }

    pub fn is_matched(&self, index: u32) -> bool {
        self.cards
            .get(index as usize)
            .map(|card| card.matched)
            .unwrap_or(false)
    }

    pub fn current_player(&self) -> u8 {
        self.current_player
    }

    pub fn score(&self, player: u32) -> u8 {
        match player {
            1 | 2 => self.scores[(player - 1) as usize],
            _ => 0,
        }
    }

    pub fn matched_pairs(&self) -> u8 {
        self.scores[0] + self.scores[1]
    }

    pub fn is_game_over(&self) -> bool {
        self.game_over
    }

    pub fn flip(&mut self, index: u32) -> u8 {
        let index = index as usize;
        if self.game_over || self.second_flipped.is_some() || index >= self.cards.len() {
            return 0;
        }
        if self.cards[index].face_up || self.cards[index].matched {
            return 0;
        }

        self.cards[index].face_up = true;

        match self.first_flipped {
            None => {
                self.first_flipped = Some(index);
                1
            }
            Some(first) => {
                if self.cards[first].value == self.cards[index].value {
                    self.cards[first].matched = true;
                    self.cards[index].matched = true;
                    self.scores[(self.current_player - 1) as usize] += 1;
                    self.first_flipped = None;
                    self.game_over = self.cards.iter().all(|card| card.matched);
                    2
                } else {
                    self.second_flipped = Some(index);
                    3
                }
            }
        }
    }

    pub fn resolve_mismatch(&mut self) {
        if let (Some(first), Some(second)) = (self.first_flipped, self.second_flipped) {
            self.cards[first].face_up = false;
            self.cards[second].face_up = false;
            self.first_flipped = None;
            self.second_flipped = None;
            self.current_player = if self.current_player == 1 { 2 } else { 1 };
        }
    }
}

#[cfg(test)]
mod tests {
    use super::GameState;

    #[test]
    fn new_deck_has_eight_pairs() {
        let game = GameState::new();
        assert_eq!(game.card_count(), 16);
        for value in 0..8 {
            let count = (0..game.card_count())
                .filter(|&index| game.card_value(index) == value)
                .count();
            assert_eq!(count, 2);
        }
    }

    #[test]
    fn mismatch_switches_player_after_resolution() {
        let mut game = GameState::new();
        let first = 0;
        let second = (1..game.card_count())
            .find(|&index| game.card_value(index) != game.card_value(first))
            .unwrap();
        let player = game.current_player();

        assert_eq!(game.flip(first), 1);
        assert_eq!(game.flip(second), 3);
        assert_eq!(game.current_player(), player);
        assert!(game.is_face_up(first));
        assert!(game.is_face_up(second));
        assert_eq!(game.flip(2), 0);

        game.resolve_mismatch();

        assert_eq!(game.current_player(), 3 - player);
        assert!(!game.is_face_up(first));
        assert!(!game.is_face_up(second));
    }

    #[test]
    fn a_match_scores_and_keeps_the_turn() {
        let mut game = GameState::new();
        let first = 0;
        let second = (1..game.card_count())
            .find(|&index| game.card_value(index) == game.card_value(first))
            .unwrap();
        let player = game.current_player();

        assert_eq!(game.flip(first), 1);
        assert_eq!(game.flip(second), 2);
        assert_eq!(game.score(player as u32), 1);
        assert_eq!(game.current_player(), player);
        assert!(game.is_matched(first));
        assert!(game.is_matched(second));
    }

    #[test]
    fn finding_all_pairs_ends_the_game() {
        let mut game = GameState::new();

        for value in 0..8 {
            let indexes: Vec<u32> = (0..game.card_count())
                .filter(|&index| game.card_value(index) == value)
                .collect();
            assert_eq!(game.flip(indexes[0]), 1);
            assert_eq!(game.flip(indexes[1]), 2);
        }

        assert!(game.is_game_over());
        assert_eq!(game.matched_pairs(), 8);
        assert_eq!(game.flip(0), 0);
    }
}
